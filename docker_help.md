(Based on template from 14Oranges/Soda)

The Docker configuration is setup in the most top-level parent directory. This is where it should be run from. This currently only
supports running locally, and the Dev/QA and Production servers are not using it, but it is intended to be done in the future. 

# First Time Setup
For the first time, there are a few additional steps that may be needed. First build and run the application to setup 
the containers:
```
$ docker-compose --env-file './ll-kasa-bridge/.env' up -d --build
```

Then you need to do run the deploy script, which will install the composer and npm packages, clear caches etc.:
```
$ docker-compose --env-file './ll-kasa-bridge/.env' exec php bash -c 'cd .devops && ./deploy.sh'
```

To see the server, navigate to
- http://localhost:8888
- http://127.0.0.1:8888

# Stopping
To stop the docker image use the following:
```
$ docker-compose --env-file './ll-kasa-bridge/.env' down
```

# Restarting
To restart (or build after changes) use the following:
```
$ docker-compose --env-file './ll-kasa-bridge/.env' up -d --build
```

# Deploy
Anytime there is a change to the server that requires a NPM/Composer or even some of the lavarel configs, the following must be run:
```
$ docker-compose --env-file './ll-kasa-bridge/.env' exec php bash -c 'cd .devops && ./deploy.sh'
```

# Updating Packages
To update the NPM/Composer packages, which should be done periodically during development, run the following script:
```
$ docker-compose  --env-file './ll-kasa-bridge/.env' exec php bash -c 'cd .devops && ./update_packages.sh'
```

# Debugging Build
```
$ docker-compose --env-file './ll-kasa-bridge/.env' build --no-cache --progress=plain
```



# Dev Tools: 

## Seed Data for Testing
Never run the below on production. It will remove existing data, then populate the database with test data. See .devops/readme_seeding.md.
```
$ docker-compose  --env-file './ll-kasa-bridge/.env' exec php bash -c 'cd ll-kasa-bridge && php artisan db:seed --class=TestDataSeeder'
```

## Run Unit Tests
See .devops/readme_unit_tests.md.
```
docker-compose  --env-file './ll-kasa-bridge/.env' exec php bash -c 'cd ll-kasa-bridge && ./vendor/bin/phpunit'
```