---
title: "Ruby on RailsでPostgreSQLに接続する"
summary: "忘れたとき用のメモ"
tags: ["Ruby on Rails", "PostgreSQL"]
---

# プロジェクトを作る

```bash
rails new new_app -d postgresql
```

> api開発の場合は`--api`オプションをつける

`rails db:create`を忘れずに

## Gemfileの編集

dbに入るためのパスワードを安全に設定するために，`dotenv-rails`を入れておく

```ruby
# Gemfile
group :development, :test do
  # See https://guides.rubyonrails.org/debugging_rails_applications.html#debugging-with-the-debug-gem
  gem "debug", platforms: %i[ mri mswin mswin64 mingw x64_mingw ], require: "debug/prelude"

  # Static analysis for security vulnerabilities [https://brakemanscanner.org/]
  gem "brakeman", require: false

  # Omakase Ruby styling [https://github.com/rails/rubocop-rails-omakase/]
  gem "rubocop-rails-omakase", require: false

  gem 'dotenv-rails'
end
```

# db設定ファイルの編集

```yml
# config/database.yml
default: &default
  adapter: postgresql
  encoding: unicode
  pool: <%= ENV.fetch("RAILS_MAX_THREADS") { 5 } %>

development:
  <<: *default
  database: sticky_backend_development

  username: postgres

  password: <%= ENV['DATABASE_PASSWORD'] %>

test:
  <<: *default
  database: sticky_backend_test
  username: postgres
  password: <%= ENV['DATABASE_PASSWORD'] %>

production:
  <<: *default
  database: sticky_backend_production
  username: postgres
  password: <%= ENV['DATABASE_PASSWORD'] %>
```

> .envファイルに`DATABASE_PASSWORD`を設定する

> 最後に`rails db:create && rails db:migrate`を忘れずに！
