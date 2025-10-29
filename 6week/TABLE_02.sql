create table nodejs.comments (
id int not null auto_increment,
commenter int not null,
comment varchar(100) not null,
created_at datetime not null default now(),
primary key(id),
index commenter_idx (commenter ASC),
constraint commenter
foreign key (commenter)
references nodejs.users (id)
on delete cascade
on update cascade)
comment = '댓글'
default charset=utf8mb4
engine = InnoDB;