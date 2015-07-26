import datetime
import re
import os
import hashlib
import urllib2

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
    code = models.CharField(max_length=200)

class Film(models.Model):
    
    title_type = models.CharField(
        max_length=5, 
        choices=TITLE_TYPES
    )
    
    code = models.CharField(max_length=200)
    
    grade = models.FloatField(blank=True, null=True)
    votes = models.PositiveIntegerField(blank=True, null=True)

    year = models.PositiveIntegerField()
    runtime = models.PositiveIntegerField(default=0, blank=True, null=True)
    
    title = models.CharField(max_length=200)
    description = models.TextField(default='')

    countries = models.ManyToManyField('Country', default=None, blank=True)
    languages = models.ManyToManyField('Language', default=None, blank=True)

    rating = models.ForeignKey('Rating', default=None, null=True, blank=True)
    rating_text = models.TextField(default='', null=True, blank=True)

    genres = models.ManyToManyField('Genre', blank=True)
    directors = models.ManyToManyField('Person', related_name='directed', blank=True)
    stars = models.ManyToManyField('Person', related_name='starred_in', blank=True)
    writers = models.ManyToManyField('Person', related_name='wrote', blank=True)
    
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
        code = self.code if self.has_cover() else "nocover"
        return self.__class__.get_potential_cover_path(code)

    @classmethod
    def download_cover(cls, code, url):
        cover_path = cls.get_potential_cover_path(code)
        with open(cover_path, 'w') as f:
            f.write(urllib2.urlopen(url).read())

    def get_cover_url(self, width=214,height=317):
        thumb = get_thumbnailer(self.get_cover_path()).get_thumbnail({
            'size': (width,height,),
            'crop': 'smart',
            'quality': 95
        })
        image_name = os.path.basename(thumb.name)
        return os.path.join(
            "/media/covers/", 
            image_name
        )

    def get_small_cover_url(self):
        return self.get_cover_url(width=162, height=240)

    def get_big_cover_url(self):
        return self.get_cover_url(width=214, height=317)

    def has_cover(self):
        return os.path.exists(
            self.__class__.get_potential_cover_path(self.code)
        )

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

    @classmethod
    def get_votes_bins(cls, num_bins=30):
        votes_max = cls.objects.all().aggregate(
            Max('votes')
        )['votes__max']
        votes_step = votes_max / num_bins
        r = range(0, votes_max, votes_step)
        ranges = zip(r[:-1],r[1:-1]+[votes_max+1])
        bins = [
            cls.objects.filter(
                votes__gte=bottom, 
                votes__lt=top
            ).count()
            for bottom, top in ranges
        ]
        bins = [v+1 for v in bins]
        bins_total = sum(bins)
        bins = [float(b)/bins_total for b in bins]
        return bins

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

class Page(models.Model):
    number = models.PositiveIntegerField(default=0)
    
    def __unicode__(self):
        return unicode(self.number)

class ActiveList(List):
    pass

class ActivePage(Page):
    pass

class FirstLanguages(models.Model):
    languages = models.ManyToManyField('Language', default=None)
    
    def remainder(self):
        return Language.objects.exclude(name__in=map(lambda x: x.name, self.languages.all())).order_by('name')
    
class FirstCountries(models.Model):
    countries = models.ManyToManyField('Country', default=None)
    
    def remainder(self):
        return Country.objects.exclude(name__in=map(lambda x: x.name, self.countries.all())).order_by('name')   
