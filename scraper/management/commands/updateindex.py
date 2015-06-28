from __future__ import with_statement
from django.core.management.base import BaseCommand, CommandError

from scraper.scraper import ScraperController

class Command(BaseCommand):
    #args = '<poll_id poll_id ...>'
    help = 'update the database with the latest imdb entries'

    def handle(self, *args, **options):
        controller = ScraperController()
        controller.scrape()
