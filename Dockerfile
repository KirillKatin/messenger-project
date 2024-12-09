# Базовый образ Node.js
FROM node:18.20.5-alpine

# Установка рабочей директории
WORKDIR /usr/src/app

# Установка дополнительных зависимостей
RUN apk add --no-cache \
    python3 \
    make \
    g++ \
    postgresql-client

# Копирование файлов package.json и package-lock.json
COPY package*.json ./

# Установка зависимостей
RUN npm ci --only=production

# Копирование исходного кода
COPY . .

# Создание необходимых директорий и настройка прав
RUN mkdir -p logs uploads \
    && chown -R node:node /usr/src/app

# Переключение на непривилегированного пользователя
USER node

# Определение переменных окружения
ENV NODE_ENV=production \
    PORT=3000

# Открытие портов
EXPOSE 3000

# Команда запуска приложения
CMD ["npm", "start"]
