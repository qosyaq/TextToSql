#TextToSql гайд по запуску для дебилов

##Сначала склонируйте проект из GitHub:
```bash
git clone https://github.com/qosyaq/TextToSql.git

##Создайте и активируйте виртуальное окружение:
```bash
python -m venv venv

###Затем запустите виртуальное окружение.

##Установка зависимостей:
```bash
pip install -r requirements.txt

##Настройка переменных окружения:
###Создайте файл .env в корневой папке проекта и добавьте:
```bash
SECRET_KEY=your_secret_key
ALGORITHM=HS256

##Запуск проекта
```bash
python main.py
