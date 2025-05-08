#!/bin/sh
until python manage.py migrate; do
  sleep 2
  echo "Retry!";
done
python manage.py compilemessages
python manage.py collectstatic --noinput --clear
echo "Django is ready.";
python manage.py runserver 0.0.0.0:80