import datetime
import re
import os
import hashlib
import urllib2
import IPython

from django.db import models
from django.core.mail import send_mail
from django import forms
from django.contrib.auth.models import User
from django.contrib.auth import authenticate, login
from django.templatetags.static import static
from django.db.models import Max
from django.conf import settings
from easy_thumbnails.files import get_thumbnailer

COVER_PATH=os.path.join(
    settings.MEDIA_ROOT, 
    "covers/"
)

TITLE_TYPES = (
    ("movie", "Movie"), 
    ("tv", "TV Show")
)

class BadFilm(models.Model):
    '''Serves as a black list for titles that give us parsing problems. 
    Usually because there's essential information missing on the IMDb page.
    This way we don't end up retrieving them over and over because we think
    we haven't indexed this title yet.'''
    code = models.CharField(max_length=200)

class Film(models.Model):
    '''Represents an IMDb title.

    TODO: Should be renamed to Title 
    (careful: migration could be very involved)
    '''
    
    title_type = models.CharField(
        max_length=5, 
        choices=TITLE_TYPES
    )
    
    code = models.CharField(max_length=200)

    title = models.CharField(max_length=200)
    description = models.TextField(default='')

    cover = models.ImageField(upload_to='covers/', blank=True, null=True)
    
    grade = models.FloatField(blank=True, null=True)
    votes = models.PositiveIntegerField(blank=True, null=True)
    year = models.PositiveIntegerField()
    runtime = models.PositiveIntegerField(default=0, blank=True, null=True)
    
    rating = models.ForeignKey('Rating', default=None, null=True, blank=True)
    rating_text = models.TextField(default='', null=True, blank=True)

    countries = models.ManyToManyField('Country', default=None, blank=True)
    languages = models.ManyToManyField('Language', default=None, blank=True)

    genres = models.ManyToManyField('Genre', blank=True)
    directors = models.ManyToManyField('Person', related_name='directed', blank=True)
    stars = models.ManyToManyField('Person', related_name='starred_in', blank=True)
    writers = models.ManyToManyField('Person', related_name='wrote', blank=True)

    NOCOVER_PATH = os.path.join(COVER_PATH, 'nocover.jpg')
    
    def __unicode__(self):
        return unicode(self.title)

    @classmethod
    def get_potential_cover_path(cls, code):
        relative_path = "%s.jpg"%(code)
        return os.path.join(
            COVER_PATH,
            relative_path
        )

    def get_cover_path(self):
        return self.cover.path if self.cover else self.NOCOVER_PATH        

    def get_cover_url(self, width=214,height=317):
        thumb = get_thumbnailer(self.get_cover_path()).get_thumbnail({
            'size': (width,height,),
            'crop': 'smart',
            'quality': 95
        })
        return os.path.join(
            self.cover.storage.base_url,
            self.cover.field.upload_to, 
            os.path.basename(thumb.url)
        )

    def get_small_cover(self):
        WIDTH, HEIGHT = 162, 240
        url = self.get_cover_url(width=WIDTH, height=HEIGHT)
        return {
            'width': WIDTH,
            'height': HEIGHT,
            'url': url
        }

    def get_big_cover(self):
        WIDTH, HEIGHT = 214, 317
        url = self.get_cover_url(width=WIDTH, height=HEIGHT)
        return {
            'width': WIDTH,
            'height': HEIGHT,
            'url': url
        }

    def has_cover(self):
        return True if self.cover else False

    def get_imdb_url(self):
        return "http://imdb.com/title/%s/"%(self.code)
        
    def label_tags(self, objects):
        return [item.name for item in list(objects)]
        
    def get_genre_tags(self):
        return self.label_tags(self.genres.all())

    def get_director_tags(self):
        return self.label_tags(self.directors.all())

    def get_writer_tags(self):
        return self.label_tags(self.writers.all())
        
    def get_star_tags(self):
        return self.label_tags(self.stars.all())

    def get_rating_label(self):
        if self.rating:
            return self.rating.name
        else:
            return ""

class Label(models.Model):
    name = models.CharField(max_length=200, default='')
    
    def __unicode__(self):
        return unicode(self.name)

class Rating(Label):
    pass

class Country(Label):
    pass

class Language(Label):
    pass

class Genre(Label):
    pass

class Person(Label):
    pass
    
class List(models.Model):
    code = models.CharField(max_length=200)
    
    def __unicode__(self):
        return unicode(self.code)
