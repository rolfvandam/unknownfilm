import re
import json

from bs4 import BeautifulSoup as BS
from django.test import TestCase
from django import forms
from django.test import Client

from scraper.imdb import IMDBTitlePage

from .forms import TitleForm
from .models import Film

TERMINATOR_IMDB_ID = "tt0088247"

class UFilmTestCase(TestCase):


    def create_only_terminator(self):
        Film.objects.all().delete()
        imdb_title_getter = IMDBTitlePage()
        d = imdb_title_getter.get_info(imdb_id=TERMINATOR_IMDB_ID)
        return TitleForm.create_from_data(TERMINATOR_IMDB_ID, d)

    def test_title_form(self):
        title = self.create_only_terminator()
        self.assertEquals(title.title, "The Terminator")

        # There can only be one...
        with self.assertRaises(forms.ValidationError):
            imdb_title_getter = IMDBTitlePage()
            d = imdb_title_getter.get_info(imdb_id=TERMINATOR_IMDB_ID)
            TitleForm.create_from_data(TERMINATOR_IMDB_ID, d)

    def test_film_model(self):
        film = self.create_only_terminator()
        self.assertEquals(film.title, "The Terminator")
        self.assertTrue(re.search("\.jpg$", film.cover.url))
        self.assertEquals(film.rating.name, "R")
        
    def test_main_view(self):
        client = Client()
        response = client.get('/')
        soup = BS(response.content, "html.parser")
        self.assertTrue(soup.select('img#logo'))

    def test_initial_data_view(self):
        title = self.create_only_terminator()
        client = Client()
        response = client.get('/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        data = json.loads(response.content)
        self.assertTrue(data.has_key("sliders"))

    def test_listing_view(self):
        title = self.create_only_terminator()
        client = Client()
        response = client.get('/api/films/', HTTP_X_REQUESTED_WITH='XMLHttpRequest')
        data = json.loads(response.content)
        self.assertTrue(data.has_key("results"))
        self.assertTrue(data.has_key("count"))

        