FROM nginx:alpine

RUN rm -rf /usr/share/nginx/html/*

COPY tela_login/html/ /usr/share/nginx/html/
COPY tela_login/css/ /usr/share/nginx/html/css/
COPY tela_login/js/ /usr/share/nginx/html/js/
COPY tela_home/html/ /usr/share/nginx/html/
COPY tela_home/css/ /usr/share/nginx/html/css/
COPY tela_home/js/ /usr/share/nginx/html/js/
COPY img/ /usr/share/nginx/html/img/
COPY default.conf /etc/nginx/conf.d/default.conf

EXPOSE 80

CMD ["nginx", "-g", "daemon off;"]

# docker build -t storemanager-frontend -f docker/Dockerfile .
# docker run -p 8080:80 storemanager-frontend