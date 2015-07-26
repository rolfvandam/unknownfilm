import re
import urllib3
from bs4 import BeautifulSoup as BS
import IPython
import sys

class IMDBTitlePage(object):

    def __init__(self):
        self.http = urllib3.PoolManager()
        self.http.headers['Accept-Language'] = 'en;q=0.5'

    def get_soup(self):
        request = self.http.request('GET', self.url)
        if not request:
            raise urllib3.exceptions.HTTPError
        html = request.read()
        soup = BS(html, "html.parser")
        return soup

    def get_info(self, imdb_id=None):

        if imdb_id:
            if isinstance(imdb_id, int):
                self.url = "http://akas.imdb.com/title/tt%07d/"%(int(imdb_id))
            elif isinstance(imdb_id, str) or isinstance(imdb_id, unicode):
                self.url = "http://akas.imdb.com/title/%s/"%(imdb_id)
            else:
                raise ValueError("imdb_id is not str, unicode or int")

        soup = self.get_soup()

        def url_to_id(url):
            return re.search("((ls|nm|tt)[0-9]{7,9})", url).group(1)

        def get_people_listing(property_name):
            return [
                {
                    'name': unicode(s.select("span[itemprop=name]")[0].get_text()),
                    'imdb_id': url_to_id(s.get("href"))
                }
                for s in soup.select(
                    "#overview-top div[itemprop=%s] > a[itemprop=url]"%(
                        property_name
                    )
                )
            ]

        def rm_spaces(s):
            return re.sub("^ *?([^ ]+) *?$", r"\1", s)

        def get_url_labels(prefix):
            return [
                rm_spaces(unicode(a.get_text()))
                for a in soup.select("#titleDetails a")
                if re.search("^%s"%(prefix), a.get('href'))
            ]

        def parse_year(s):
            return re.search("\(?([0-9]{4})", s).group(1)

        def get_title_type(soup):
            if re.search("TV Series", soup.select("#overview-top .infobar")[0].get_text()):
                return "tv"
            else:
                return "movie"

        info = {}
        
        info['title'] = unicode(soup.select("#overview-top h1.header .itemprop")[0].get_text())
        info['title_type'] = get_title_type(soup)
        info['year'] = int(parse_year(soup.select("#overview-top h1.header .nobr")[0].get_text()))

        description_selector = soup.select("div[itemprop=description] p")
        info['description'] = unicode(list(description_selector[0].children)[0] if (
            description_selector and list(description_selector[0].children)
        ) else '')

        grade_selector = soup.select("#overview-top .star-box-giga-star")
        info['grade'] = float(
            grade_selector[0].get_text().replace(",",".")
        ) if grade_selector else None

        votes_selector = soup.select("#overview-top span[itemprop=ratingCount]")
        info['votes'] = int(
            votes_selector[0].get_text().replace(",","")
        ) if votes_selector else 0

        duration_selection = soup.select("time[itemprop=duration]")
        if duration_selection:
            info['runtime'] = int(
                re.search(
                    "([0-9]+) min", 
                    duration_selection[0].get_text()
                ).group(1)
            )

        info['directors'] = get_people_listing("director")
        info['writers'] = get_people_listing("creator")
        info['actors'] = get_people_listing("actors")

        info['genres'] = [
            rm_spaces(a.get_text())
            for a in soup.select("#titleStoryLine div[itemprop=genre] a")
        ]

        rating_selection = soup.select("meta[itemprop=contentRating]")
        if rating_selection:
            info['rating'] = rating_selection[0]['content']

        info['countries'] = get_url_labels("/country")
        info['languages'] = get_url_labels("/language")
        info['related_lists'] = [
            url_to_id(a.get('href'))
            for a in soup.select("#relatedListsWidget .list_name a")
        ]

        covers = soup.select("#img_primary img[itemprop=image]")
        if covers:
            info['cover_url'] = covers[0].get('src');
        else:
            info['cover_url'] = None
        return info


class IMDBListPage(IMDBTitlePage):

    @staticmethod
    def url_to_id(url):
        m = re.search("(tt[0-9]{7})\/", url)
        if m:
            return m.group(1)
        else:
            return ""

    @classmethod
    def urls_to_ids(cls, urls):
        return [
            cls.url_to_id(url)
            for url in urls
            if cls.url_to_id(url)
        ]

    def get_info(self, imdb_id=None):

        if imdb_id:
            if isinstance(imdb_id, int):
                self.url = "http://akas.imdb.com/list/ls%09d/"%(int(imdb_id))
            elif isinstance(imdb_id, str) or isinstance(imdb_id, unicode):
                self.url = "http://akas.imdb.com/list/%s/"%(imdb_id)
            else:
                raise ValueError("imdb_id is not str, unicode or int")

        soup = self.get_soup()
        assert soup
        
        s = soup.select("img.zero-z-index")
        assert s
        
        urls = [
            a.get("href")
            for a in soup.select(".list_item .info b a")
        ]
        return list(set(self.__class__.urls_to_ids(urls)))


class IMDBTVPicksPage(IMDBListPage):

    def __init__(self):
        super(self.__class__, self).__init__()
        self.url = "http://akas.imdb.com/imdbpicks/monthly-tv-picks/"


class IMDBMovieReleasesPage(IMDBListPage):

    def __init__(self):
        super(self.__class__, self).__init__()
        self.url = "http://akas.imdb.com/calendar/?region=us"

    def get_info(self):
        soup = self.get_soup()
        urls = [
            a.get("href")
            for a in soup.select("#pagecontent li a")
        ]
        return list(set(
            self.urls_to_ids(urls)
        ))

#print IMDBTitlePage("tt4532484").get_info()