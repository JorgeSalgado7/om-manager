# Etapa 1: Build
FROM node:20.19.4 AS build

# Establece directorio de trabajo
WORKDIR /app

# Copia archivos de dependencias
COPY package.json package-lock.json ./

# Instala dependencias
RUN npm ci

# Copia todo el proyecto
COPY . .

# Construye la app Angular para producción
RUN npm run build -- --configuration production

# Etapa 2: Servir con nginx
FROM nginx:alpine

# Copia los archivos construidos desde la etapa build
COPY --from=build /app/dist/mfe-om-manager/browser /usr/share/nginx/html

# Opcional: copia configuración personalizada de nginx si tienes
# COPY nginx.conf /etc/nginx/nginx.conf

# Expone el puerto 80
EXPOSE 80

# Comando por defecto para iniciar nginx en primer plano
CMD ["nginx", "-g", "daemon off;"]
