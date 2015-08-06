"""unknownfilm URL Configuration

The `urlpatterns` list routes URLs to views. For more information please see:
    https://docs.djangoproject.com/en/1.8/topics/http/urls/
Examples:
Function views
    1. Add an import:  from my_app import views
    2. Add a URL to urlpatterns:  url(r'^$', views.home, name='home')
Class-based views
    1. Add an import:  from other_app.views import Home
    2. Add a URL to urlpatterns:  url(r'^$', Home.as_view(), name='home')
Including another URLconf
    1. Add an import:  from blog import urls as blog_urls
    2. Add a URL to urlpatterns:  url(r'^blog/', include(blog_urls))
"""
from django.conf.urls import include, url
from django.contrib import admin
from django.conf.urls.static import static
from django.http import HttpResponse
from rest_framework import routers

from views import home, help_, about, FilmViewSet, init_listing_config

router = routers.DefaultRouter()
router.register(r'film', FilmViewSet)

urlpatterns = [
    url(r'^$', home, name="home"),
    url(r'^help/', help_, name="help"),
    url(r'^about/', about, name="about"),
    url(r'^init/', init_listing_config, name="init_listing_config"),
]
