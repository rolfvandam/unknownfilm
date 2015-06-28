from django.test import TestCase

from .imdb import IMDBTitlePage, IMDBListPage, IMDBTVPicksPage, IMDBMovieReleasesPage
from .scraper import TVScraper, MovieScraper

TERMINATOR_IMDB_ID = "tt0088247"
ROBOCOP_IMDB_ID = "tt0093870"
FUTURISTIC_MOVIE_LIST_ID = "ls057219676"
BREAKING_BAD_IMDB_ID = "tt0903747"
TV_SHOW_LIST_ID = "ls053069181"

class IMDBTestCase(TestCase):


    def test_title_page(self):

        imdb_title_getter = IMDBTitlePage()
        
        d = imdb_title_getter.get_info(imdb_id=TERMINATOR_IMDB_ID)
        self.assertEqual(d['title'], "The Terminator")

        d = imdb_title_getter.get_info(imdb_id=ROBOCOP_IMDB_ID)
        self.assertEqual(d['title'], "RoboCop")


    def test_list_page(self):

        imdb_list_getter = IMDBListPage()
        
        imdb_list = imdb_list_getter.get_info(
            imdb_id=FUTURISTIC_MOVIE_LIST_ID
        )

        self.assertTrue(len(imdb_list) > 0)
        self.assertTrue(TERMINATOR_IMDB_ID in imdb_list)
        self.assertTrue(ROBOCOP_IMDB_ID in imdb_list)


    def test_tv_picks_page(self):

        imdb_tv_picks_getter = IMDBTVPicksPage()
        imbd_tv_picks_list = imdb_tv_picks_getter.get_info()
        self.assertTrue(len(imbd_tv_picks_list) > 0)


    def test_movie_releases_page(self):

        imdb_movie_releases_getter = IMDBMovieReleasesPage()
        imdb_movie_releases_list = imdb_movie_releases_getter.get_info()
        self.assertTrue(len(imdb_movie_releases_list) > 0)


class ScraperTestCase(TestCase):


    def test_movie_scraper_processing(self):

        scraper = MovieScraper()
        imdb_title_getter = IMDBTitlePage()
        title = scraper.process_title(
            TERMINATOR_IMDB_ID, 
            title_page_getter=imdb_title_getter
        )
        self.assertEqual(title.title, "The Terminator")

        imdb_list_getter = IMDBListPage()
        titles = scraper.process_list(
            FUTURISTIC_MOVIE_LIST_ID, 
            list_page_getter=imdb_list_getter
        )
        self.assertFalse(title.code in titles)


    def test_tv_scraper_processing(self):

        scraper = TVScraper()
        imdb_title_getter = IMDBTitlePage()
        title = scraper.process_title(
            BREAKING_BAD_IMDB_ID, 
            title_page_getter=imdb_title_getter
        )
        self.assertTrue(title.title, "Breaking Bad")

        imdb_list_getter = IMDBListPage()
        titles = scraper.process_list(
            TV_SHOW_LIST_ID, 
            list_page_getter=imdb_list_getter
        )
        self.assertFalse(title.code in titles)

