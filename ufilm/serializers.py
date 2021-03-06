from rest_framework import serializers
from models import Film as Title

class FilmSerializer(serializers.ModelSerializer):
    '''Serializes titles for display on the site'''

    small_cover = serializers.DictField(source='get_small_cover', read_only=True)
    big_cover = serializers.DictField(source='get_big_cover', read_only=True)
    rating_label = serializers.CharField(source='get_rating_label', read_only=True)
    imdb_url = serializers.CharField(source='get_imdb_url', read_only=True)

    class Meta:
        model = Title
        fields = (
            'id',
            'title',
            'year',
            'description',
            'runtime', 
            'grade', 
            'rating_label', 
            'votes', 
            'small_cover',
            'big_cover',
            'imdb_url',
            'writers',
            'stars',
            'directors',
            'genres'
        )
        depth = 2
