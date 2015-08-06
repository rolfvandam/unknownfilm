import signal
import sys
import threading
import urllib3
import cProfile

from django import forms

from ufilm.models import Film as ProcessedTitle, BadFilm as BadProcessedTitle
from ufilm.forms import TitleForm

from .models import Title, TitleList
from .imdb import IMDBTVPicksPage, IMDBMovieReleasesPage, IMDBTitlePage, IMDBListPage


class Scraper(object):
    '''Parent class that implements the scraping process for a particular title type'''

    CACHE_SIZE = 1000

    def __init__(self, threads=1):
        '''Seeds the scraper with new titles from, for example, 
        the tv picks page or movie releases page.

        threads -- int, sets the number of threads to use for this scraper
        '''
        self.max_threads = threads
        self.threads = []
        self.title_cache = {}
        self.list_cache = {}
        print "Initializing %s scraper..."%(self.title_type)
        new_titles = self.filter_existing_titles(
            self.imdb_seeder_class().get_info()
        )
        self.add_new_titles(new_titles)

    @classmethod
    def clean_queue(cls):
        '''Rids the title queue of already scraped titles (just in case) and unlocks
        the titles that were about to be scraped but were rudely interrupted by 
        some uncaring user.'''
        print "Cleaning queue..."
        for title in Title.objects.all():
            if (ProcessedTitle.objects.filter(code=title.code).exists() or
                BadProcessedTitle.objects.filter(code=title.code).exists()):
                title.delete()
        Title.objects.filter(
            is_locked=True
        ).update(is_locked=False)

    def in_cache(self, item, cache_dict):
        if len(cache_dict) >= self.CACHE_SIZE:
            least_referenced_item = sorted(
                cache_dict.keys(), 
                key=lambda k: cache_dict[k]
            )[0]
            del cache_dict[least_referenced_item]
        if cache_dict.has_key(item):
            cache_dict[item] += 1
            return True
        else:
            return False

    def add_to_cache(self, item, cache_dict):
        if cache_dict.has_key(item):
            cache_dict[item] += 1
        else:
            cache_dict[item] = 1

    # We use a cache for titles and lists to save trips to the db when
    # we already know that it's not a new item.
    def in_title_cache(self, title):
        return self.in_cache(title, self.title_cache)

    def in_list_cache(self, list_):
        return self.in_cache(list_, self.list_cache)

    def is_previously_processed_title(self, title):
        if ProcessedTitle.objects.filter(code=title).exists() or (
                BadProcessedTitle.objects.filter(code=title).exists()):
            self.add_to_cache(title, self.title_cache)
            return True
        else:
            return False

    def filter_existing_titles(self, titles):
        return [
            title
            for title in titles
            if not self.in_title_cache(title) and (
                not Title.objects.filter(code=title).exists()
            ) and not self.is_previously_processed_title(title)
        ]

    def add_new_scrapables(self, new_scrapables, scrapable_class):
        for new_scrapable in new_scrapables:
            scrapable_class.objects.create(
                code=new_scrapable, 
                title_type=self.title_type
            )

    def add_new_titles(self, new_titles):
        self.add_new_scrapables(new_titles, Title)

    def add_new_lists(self, new_lists):
        self.add_new_scrapables(new_lists, TitleList)

    def output_message(self, message):
        self.print_lock.acquire()
        print message
        self.print_lock.release()

    def is_previously_processed_list(self, list_):
        if TitleList.objects.filter(code=list_).exists():
            self.add_to_cache(list_, self.list_cache)
            return True
        else:
            return False            

    def process_title(self, title_code, title_page_getter=None):
        if not title_page_getter:
            title_page_getter = self.title_page_getter
        imdb_data = title_page_getter.get_info(imdb_id=title_code)
        new_lists = [
            imdb_list
            for imdb_list in imdb_data.get(
                'related_lists',
                []
            )
            if not self.in_list_cache(imdb_list) and ( 
                not self.is_previously_processed_list(imdb_list)
            )
        ]
        self.add_new_lists(new_lists)
        try:
            title = TitleForm.create_from_data(title_code, imdb_data)
        except forms.ValidationError:
            bad_title = BadProcessedTitle.objects.get_or_create(code=title_code)[0]
            print "Bad title:", bad_title.code, self.title_type
            return None
        print "New title: %s (%s) (%s)"%(title.title, title.title_type, self.title_type)
        return title

    def process_list(self, list_code, list_page_getter=None):
        if not list_page_getter:
            list_page_getter = self.list_page_getter
        titles = list_page_getter.get_info(imdb_id=list_code)
        new_titles = self.filter_existing_titles(titles)
        self.add_new_titles(new_titles)
        return new_titles

    def scrape_loop(self):
        '''This is the main loop that all the workers run to get more titles / lists'''
        title_page_getter = IMDBTitlePage()
        list_page_getter = IMDBListPage()
        while True:
            try:
                title = Title.get_and_lock_from_top(self.title_type)
                if title:
                    self.process_title(title.code, title_page_getter=title_page_getter)
                    title.delete()
                else:
                    title_list = TitleList.get_and_lock_from_top(self.title_type)
                    if title_list:
                        self.process_list(title_list.code, list_page_getter=list_page_getter)
                        title_list.is_processed = True
                        title_list.is_locked = False
                        title_list.save()
                    else:
                        self.output_message("Nothing left to scrape, thread exiting...")
                        return

                ''' 
                We should keep going no matter what. We can always try 
                another title/list but we can't loose the thread or 
                we'll degrade performance throughout the run.
                '''
            except(
                UnicodeEncodeError, 
                AssertionError, 
                urllib3.exceptions.HTTPError, 
                IndexError, 
                AttributeError
            ) as e:
                self.output_message(
                    "Scrape error, continuing thread... %s"%(
                        unicode(e)
                    )
                )

    def start_scrape_threads(self):
        self.print_lock = threading.Lock()
        for i in range(0, self.max_threads):
            thread = threading.Thread(target=self.scrape_loop)
            thread.setDaemon(True)
            self.threads.append(thread)
            thread.start()

    def start(self):
        '''Starts the whole thing'''
        self.start_scrape_threads()
        print "%s threads started"%(self.title_type)

class TVScraper(Scraper):
    '''Just scrapes titles and lists of type tv'''

    imdb_seeder_class = IMDBTVPicksPage
    title_type = 'tv'

class MovieScraper(Scraper):
    '''Just scrapes titles and lists of type movie'''

    imdb_seeder_class = IMDBMovieReleasesPage
    title_type = 'movie'

class ScraperController(object):
    '''This runs the whole scraping show.'''

    def exit_handler(self, signal, frame):
        print('Exiting...')
        sys.exit(0)

    def wait_for_ctrl_c(self):
        signal.signal(signal.SIGINT, self.exit_handler)
        print('Press Ctrl+C to quit')
        signal.pause()

    def scrape(self):
        '''This starts the scraping process.

        It's implemented in such a way that we should get a nice mix of 
        tv and movies all the way through.
        '''
        Scraper.clean_queue()
        
        self.tv_scraper = TVScraper(threads=2)
        self.movie_scraper = MovieScraper(threads=2)

        self.tv_scraper.start()
        self.movie_scraper.start()
        
        self.wait_for_ctrl_c()
