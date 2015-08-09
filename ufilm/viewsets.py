import json

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
    '''Provides the REST interface for the title listing'''
    
    queryset = Film.objects.all().order_by('-grade')
    serializer_class = FilmSerializer
    permission_classes = [AllowAny]

    # Translates a given GET parameter into a function that 
    # accepts the parameter value and a queryset and returns 
    # the appropriate (further) filtered queryset
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
        'movies': type_filter('title_type','movie'),

        'coverless': lambda queryset, value: queryset.exclude(cover='').exclude(cover=None) if not (
                value and json.loads(value)
            ) else queryset
    }
    
    def get_queryset(self):
        '''Goes through all the GET parameters for this query that are mapped to 
        queryset modifiers and modifies the queryset to reflect them.'''
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
