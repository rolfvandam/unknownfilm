from django import forms

from .models import Film as Title, Country, Language, Genre, Person, Rating

class TitleForm(forms.ModelForm):

    class Meta:
        model = Title
        fields = [
            'title_type',
            
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
        
        def names_to_object_ids(key, model, accessor=lambda x: x):
            if data.has_key(key):
                return [
                    model.objects.get_or_create(name=accessor(name))[0].id
                    for name in data[key]
                ]
            else:
                return []

        person_accessor = lambda x: x['name']

        resolved_data = {}
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

            'countries': names_to_object_ids('countries', Country),
            'languages': names_to_object_ids('languages', Language),
            'genres': names_to_object_ids('genres', Genre),
            'directors': names_to_object_ids('directors', Person, accessor=person_accessor),
            'stars': names_to_object_ids('actors', Person, accessor=person_accessor),
            'writers': names_to_object_ids('writers', Person, accessor=person_accessor)

        })
        form = cls(resolved_data)
        if form.is_valid():
            if data.has_key('cover_url') and data['cover_url']:
                Title.download_cover(imdb_code, data['cover_url'])
            return form.save()
        else:
            raise forms.ValidationError("Title create: %s"%(unicode(form.errors)))

