from django.shortcuts import render
from django.shortcuts import render_to_response
from django.template import RequestContext
from django.http import HttpResponse, JsonResponse

from .filmlistingcontroller import FilmListingController


def init_listing_config(request):
    controller = FilmListingController(request=request)
    return JsonResponse(controller.config)

def home(request):
    '''Homepage view'''
    current = 'home'
    return render_to_response("ufilm/home.html", locals(), context_instance=RequestContext(request))

def help_(request):
    current = 'help'
    return render_to_response("ufilm/help.html", locals(), context_instance=RequestContext(request))

def about(request):
    current = 'about'
    return render_to_response("ufilm/about.html", locals(), context_instance=RequestContext(request))
