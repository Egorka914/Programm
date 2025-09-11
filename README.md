# PWA «Ремонт ПК» — шаблон

В этом архиве:
- index.html — страница входа/регистрации
- dashboard.html — личный кабинет (PWA)
- auth.js — логин/регистрация (замените SUPABASE_URL и SUPABASE_ANON_KEY)
- dashboard.js — логика работы с задачами и ролями (читает из таблицы profiles)
- style.css — базовые стили
- manifest.json — манифест PWA
- service-worker.js — простой service worker
- sql/setup.sql — SQL для создания таблиц profiles и tasks и триггера
- icons/ — папка с иконками

## Быстрый старт
1. Замените в auth.js `SUPABASE_URL` и `SUPABASE_ANON_KEY` на свои из проекта Supabase (anon key).
2. Выполните `sql/setup.sql` в SQL Editor Supabase.
3. Запустите локальный http сервер в папке с проектом, например:
   - Python 3: `python -m http.server 5500`
4. Откройте http://127.0.0.1:5500 в браузере.
5. Зарегистрируйтесь, подтвердите почту (если включено) и войдите.
6. В Supabase -> Authentication -> Users найдите свой uid и в таблице profiles установите роль 'admin' (либо через админку в приложении).

Если будут ошибки с RLS, временно отключите RLS для таблицы profiles:
`ALTER TABLE public.profiles DISABLE ROW LEVEL SECURITY;`
