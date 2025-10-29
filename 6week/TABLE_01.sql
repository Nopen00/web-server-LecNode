CREATE SCHEMA nodejs;
use nodejs;

create table nodejs.users (
id INT not null auto_increment,
name varchar(20) not null,
age int unsigned not null,
married tinyint not null,
comment text null,
created_at datetime not null default now(),
primary key(id),
unique index name_UNIQUE(name ASC))
comment = '사용자정보'
default charset = utf8
engine = InnoDB;