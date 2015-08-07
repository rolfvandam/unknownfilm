# unknownfilm

This is the repository for the site running at [unknownfilm.net](http://www.unknownfilm.net).

The only thing missing is the `host-settings.json` file. This should be placed one directory below the checked out repo. It includes all the sensitive information that we absolutely do not want to have in a public repository. It should look like this:

    {
        "DEBUG": true,
        "DB_USER": "yourdbusername",
        "DB_PASSWORD": "yourdbpassword",
        "DB_HOST": "yourdbhostname",
        "SECRET": "your django project secret"
    }

This project includes the scraper used to get the imdb title information. It can be run with `python manage.py updateindex`.
