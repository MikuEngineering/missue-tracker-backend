FROM node

WORKDIR /usr/src/app

ARG PORT=8000
ARG DB_HOST=database
ARG DB_USERNAME=missue
ARG DB_PASSPORT=mtpassword
ARG DB_DATABASE=missue_tracker
ARG SESSION_SECRET="nest secret"

COPY . .

RUN npm install

RUN npm run build

ADD https://github.com/ufoscout/docker-compose-wait/releases/download/2.6.0/wait /wait
RUN chmod +x /wait

ENV PORT=$PORT \
    DB_HOST=$DB_HOST \
    DB_USERNAME=$DB_USERNAME \
    DB_DATABASE=$DB_DATABASE \
    SESSION_SECRET=$SESSION_SECRET

EXPOSE $PORT

CMD /wait && npm run start -- -p $PORT
