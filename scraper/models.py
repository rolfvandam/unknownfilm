from django.db import models
from django.db import transaction

from ufilm.models import TITLE_TYPES

class Scrapable(models.Model):
    '''Abstract class for items that can be scraped'''
    
    is_locked = models.BooleanField(default=False)
    code = models.CharField(
        max_length=20
    )
    title_type = models.CharField(
        max_length=5, 
        choices=TITLE_TYPES
    )

    class Meta:
        abstract = True

    def lock(self):
        self.update(is_locked=True)

    @classmethod
    @transaction.atomic
    def get_and_lock_from_top(cls, title_type):
        '''Returns the next scrapable of type title_type that should be scraped'''
        try:
            
            scrapable = cls.objects.select_for_update().filter(
                **cls.SCRAPABILITY_QUALIFIERS
            ).filter(
                title_type=title_type
            ).order_by('-id').first()

            if scrapable:
                cls.objects.filter(pk=scrapable.pk).update(is_locked=True)
                return scrapable
            else:
                return None

        except cls.DoesNotExist:

            return None

class Title(Scrapable):
    '''Scrapable title

    If is_locked is set this title is in the process of being scraped
    '''

    SCRAPABILITY_QUALIFIERS = {
        'is_locked': False
    }

class TitleList(Scrapable):
    '''Scrapable list of titles

    title_type in this context means the title type that this list appeared on when it was added

    If is_locked is set this list is in the process of being scraped or has been scraped.
    If is_processed is set as well this means the list has been scraped.
    '''

    SCRAPABILITY_QUALIFIERS = {
        'is_locked': False,
        'is_processed': False
    }
    
    is_processed = models.BooleanField(default=False)
    
