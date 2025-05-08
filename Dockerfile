FROM python:3.12.3

RUN apt-get update && apt-get install -y gettext libgettextpo-dev libproj-dev
RUN mkdir /backend
WORKDIR /backend
ADD requirements.txt /backend/

RUN pip install -r requirements.txt
ADD . /backend/
EXPOSE 8000
RUN chmod +x entrypoint.sh
ENTRYPOINT ["/backend/entrypoint.sh"]
