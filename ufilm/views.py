import json

from django.shortcuts import render
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.db.models import Count, Max
from django.http import HttpResponse
from django.views.decorators.csrf import csrf_exempt

from rest_framework import viewsets
from rest_framework import mixins
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework.decorators import detail_route, list_route
from rest_framework.decorators import api_view
from rest_framework.views import APIView
from rest_framework.reverse import reverse as rest_reverse

from models import Film, Genre, Rating, Language, Country
from serializers import FilmSerializer

def scalar_filter(field_name, filter_type, conversion=int):
    return lambda queryset, value: queryset.filter(
        **{
            "%s__%s"%(field_name, filter_type): conversion(value)
        }
    )

def type_filter(field_name, title_type):
    return lambda queryset, value: queryset if value == "true" else queryset.exclude(
        **{field_name:title_type}
    )

def int_filter(field_name, filter_type):
    return scalar_filter(field_name, filter_type, conversion=int)

def float_filter(field_name, filter_type):
    return scalar_filter(field_name, filter_type, conversion=float)

def list_filter(field_name):
    return lambda queryset, id_list_string: queryset.filter(
        **{
            "%s__in"%(field_name): [
                int(id_string)
                for id_string in id_list_string.split(',')
            ]
        }
    )

class FilmViewSet(viewsets.ModelViewSet):
    
    queryset = Film.objects.all().order_by('-grade')
    serializer_class = FilmSerializer
    permission_classes = [AllowAny]

    param_to_filter_map = {
        'year_min': int_filter('year', 'gte'),
        'year_max': int_filter('year', 'lte'),
        'score_min': float_filter('grade', 'gte'),
        'score_max': float_filter('grade', 'lte'),
        'votes_min': int_filter('votes', 'gte'),
        'votes_max': int_filter('votes', 'lte'),

        'ratings_included': list_filter('rating_id'),
        'genres_included': list_filter('genres__id'),
        'countries_included': list_filter('countries__id'),
        'languages_included': list_filter('languages__id'),

        'tv': type_filter('title_type','tv'),
        'movies': type_filter('title_type','movie')
    }
    
    def get_queryset(self):
        queryset = self.queryset
        for key in self.param_to_filter_map.keys():
            if self.request.GET.has_key(key) and self.request.GET.get(key):
                queryset = self.param_to_filter_map[key](
                    queryset,
                    self.request.GET.get(key)
                )
        sortby = self.request.GET.get('sortby', 'grade')
        order = self.request.GET.get('order', '')
        queryset = queryset.order_by(
            "%s%s"%(
                order,
                sortby
            )
        )
        return queryset.distinct()

class FilmListingController(object):

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
        max_votes = Film.objects.all().aggregate(Max('votes'))['votes__max']
        max_year = Film.objects.all().aggregate(Max('year'))['year__max']
        votes_bins = Film.get_votes_bins(num_bins=30)
        return {
            "sliders":{
                "order":["votes","score","year"],
                "sets":{
                    "votes": {
                        "label": "Votes",
                        "min": 0, 
                        "max": max_votes,
                        "round": 0,
                        "left_value": 200,
                        "right_value": max_votes,
                        "bins": votes_bins
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
                "coverless": ("Without cover", ""),
                "movies": ("Movies", "true"),
                "tv": ("TV", "")
            },
            "listing_url": "%s.json"%(
                rest_reverse('film-list', request=self.request)
            )
        }

def home(request):
    current = 'home'
    if request.is_ajax():
        controller = FilmListingController(request=request)
        initial_data_dump = json.dumps(controller.config)
        return HttpResponse(initial_data_dump)
    return render_to_response("ufilm/home.html", locals(), context_instance=RequestContext(request))

def help_(request):
    current = 'help'
    return render_to_response("ufilm/help.html", locals(), context_instance=RequestContext(request))

def about(request):
    current = 'about'
    return render_to_response("ufilm/about.html", locals(), context_instance=RequestContext(request))
