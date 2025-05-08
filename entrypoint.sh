#!/bin/sh
until python manage.py migrate; do
  sleep 2
  echo "Retry!";
done
python manage.py compilemessages
python manage.py collectstatic --noinput --clear
echo "Django is ready.";

export $(cat .env | grep -v '^#' | xargs)

if [ "$ENVIRONMENT" = "production" ]; then
    echo "Starting production server with Daphne..."
    daphne -e ssl:80:privateKey=/etc/letsencrypt/live/ashonia.info/privkey.pem:certKey=/etc/letsencrypt/live/ashonia.info/fullchain.pem app.asgi:application
else
    echo "Starting development server..."
    python manage.py runserver 0.0.0.0:80
fi