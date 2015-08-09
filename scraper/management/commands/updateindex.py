from __future__ import with_statement
from django.core.management.base import BaseCommand, CommandError

from scraper.scraper import ScraperController

class Command(BaseCommand):
    #args = '<poll_id poll_id ...>'
    help = 'update the database with the latest imdb entries'

    def add_arguments(self, parser):
        # Named (optional) arguments
        parser.add_argument('--skip-init',
            action='store_true',
            dest='skip_init',
            default=False,
            help='Skip retrieving TV Picks/Movie Releases before starting')

    def handle(self, *args, **options):
        controller = ScraperController()
        controller.scrape(skip_init=options['skip_init'])
