from django.shortcuts import render
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.db.models import Count, Max
from django.http import HttpResponse, JsonResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import detail_route, list_route
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.reverse import reverse as rest_reverse

from .models import Film, Genre, Rating, Language, Country
from .serializers import FilmSerializer


class FilmListingController(object):
    '''Provides the frontend with the data to configure the film listing.'''

    def __init__(self, config=None, request=None):
        self.request = request
        if not config:
            self.config = self.get_initial_listing()
        else:
            self.config = config

    def check_category_to_pairs(self, model):
        return {
            "model": model.__name__.lower(),
            "options": {
                o.id: {
                    "label": o.name,
                    "value": False
                }
                for o in model.objects.all().annotate(
                    num_films=Count('film')
                ).order_by('-num_films')
            }
        }

    def get_initial_listing(self):
        '''Returns the initial data to drive the configuration of the film listing'''
        max_votes = Film.objects.all().aggregate(Max('votes'))['votes__max']
        max_year = Film.objects.all().aggregate(Max('year'))['year__max']
        return {
            "sliders":{
                "order":["votes","score","year"],
                "sets":{
                    "votes": {
                        "label": "Votes",
                        "min": 0, 
                        "max": max_votes,
                        "round": 0,
                        "left_value": 50000,
                        "right_value": max_votes,
                        "log_scale": True
                    },
                    "score": {
                        "label": "Score",
                        "min": 0,
                        "max": 10,
                        "round": 1,
                        "left_value": 0,
                        "right_value": 10
                    },
                    "year": {
                        "label": "Year",
                        "min": 1900,
                        "max": max_year,
                        "round": 0,
                        "left_value": 1900,
                        "right_value": max_year
                    }
                }
            },
            "checkboxes": {
                "order": ["genres", "ratings", "languages", "countries"],
                "sets":{
                    "genres": self.check_category_to_pairs(Genre),
                    "ratings": self.check_category_to_pairs(Rating),
                    "languages": self.check_category_to_pairs(Language),
                    "countries": self.check_category_to_pairs(Country)
                }
            },
            "sorters":{
                "sortby":{
                    "options": [
                        ("Score", "grade"), 
                        ("Votes", "votes"),
                        ("Year", "year")
                    ],
                    "value": "grade"
                },
                "order":{
                    "options": [
                        ("Ascending","-"),
                        ("Descending","")
                    ],
                    "value": "-"
                }
            },
            "features":{
                "order": ["coverless", "movies", "tv"],
                "coverless": ("Without cover", False),
                "movies": ("Movies", True),
                "tv": ("TV", "")
            },
            "listing_url": "%s.json"%(
                rest_reverse('film-list', request=self.request)
            )
        }
