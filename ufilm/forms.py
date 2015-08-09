import urllib2
import IPython

from django import forms
from django.core.files.base import ContentFile

from .models import Film as Title, Country, Language, Genre, Person, Rating, TitleType

class TitleForm(forms.ModelForm):
    '''This is used to validate the data coming from IMDb'''

    class Meta:
        model = Title
        fields = [
            'title_type',
            'type_tags',
            
            'code',
            
            'grade',
            'votes',

            'year',
            'runtime',
            
            'title',
            'description',

            'countries',
            'languages',

            'rating',

            'genres',
            'directors',
            'stars',
            'writers'
        ]

    direct_fields = [
        'title_type',
        
        'grade',
        'votes',

        'year',
        'runtime',
        
        'title',
        'description'
    ]

    def clean_code(self):
        imdb_code = self.cleaned_data['code']
        if Title.objects.filter(code=imdb_code).exists():
            raise forms.ValidationError('Title already exists')
        return imdb_code

    @classmethod
    def create_from_data(cls, imdb_code, data):
        '''Returns a new Title object based on data retrieved from IMDb

        imdb_code -- string, title identifier used on IMDb
        data -- dict containing the data returned from IMDb
        '''

        def names_to_objects(key, model, accessor=lambda x: x):
            if data.has_key(key):
                return [
                    model.objects.get_or_create(name=accessor(name))[0].id
                    for name in data[key]
                ]
            else:
                return []

        person_accessor = lambda x: x['name']

        resolved_data = {}
        file_data = {}
        resolved_data.update({
            key: data[key] if data.has_key(key) else None
            for key in cls.direct_fields
        })

        rating = Rating.objects.get_or_create(name=data['rating'])[0] if (
            data.has_key('rating') and data['rating']
        ) else None

        resolved_data.update({

            'code': imdb_code,
            'rating': rating,
            'type_tags': names_to_objects('type_tags', TitleType),

            'countries': names_to_objects('countries', Country),
            'languages': names_to_objects('languages', Language),
            'genres': names_to_objects('genres', Genre),
            'directors': names_to_objects('directors', Person, accessor=person_accessor),
            'stars': names_to_objects('actors', Person, accessor=person_accessor),
            'writers': names_to_objects('writers', Person, accessor=person_accessor)

        })
        form = cls(resolved_data)
        if form.is_valid():
            if data.has_key('cover_url') and data['cover_url']:
                content = urllib2.urlopen(data['cover_url']).read()
                o = form.save(commit=False)
                filename = "%s.jpg"%(o.code)
                o.cover.save(
                    filename, 
                    ContentFile(content)
                )
                form.save_m2m()
                return o
            else:
                return form.save()
        else:
            raise forms.ValidationError("Title IMDb data invalid: %s"%(unicode(form.errors)))

