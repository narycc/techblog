## 我的mysql 日常使用记录

自从来了达飞工作以后我的工作模式相比以前在一加手机完全变了，以前在一加手机主要是做页面效果，电商交互之类的工作，现在写nodejs 多一点。因为我们当前的数据存储还是使用mysql 的方式，所以以前那些mysql 的基础知识就又得重新拿起来了，所幸我以前在迅雷看看写过php，所以数据库的知识还记得一点。

这一篇章主要包括数据库的操作，数据表的操作，权限设置,存储过程等内容。

### 数据库的操作

不用废话，直接上。

```markdown
1，连接数据库
> mysql -hhostip -uuser -ppassword; #例如mysql -h10.18.2.18 -unarycc -p123456

2, 列出当前账户下能访问的所有的数据库
> show databases;

3, 创建新数据库
> CREATE DATABASE IF NOT EXISTS new_database DEFAULT CHARSET utf8 COLLATE utf8_general_ci; 
# 这句话的含义是如果没有new_database 为名的数据库则创建，并且设置字符集为utf-8, 且校对字符规则为utf8_general_ci 
# 这里的ci 意思为case insensitive 就是大小写不敏感的意思。这样，在查找数据库表的时候 a 和 A是一样的。
# utf8-general-cs 表示大小写敏感。还有一个校对规则为utf8-unicode-ci/cs #这个校对规则相对utf8-general-ci/cs 在特殊语言上面较为准确，但是速度较慢。

> CREATE DATABASE IF NOT EXISTS new_database DEFAULT CHARSET gbk COLLATE gbk_chinese_ci; #数据库字符集的问题还有很多可以研究和探讨的地方，等来日再细化

4，删除数据库
> drop database new_database;

```

### Mysql 用户操作
mysql 中有一个数据库名字叫mysql，对用户的操作就是在这个数据库中进行的。
```markdown
1，进入到mysql的用户表中
> use mysql;
> show tables; #就能看到有一个user 表；
> desc user; # 可以先看下这个user表的ddl 描述
> select * from user; # 看下这个表中的所有用户信息，当然密码是被加密的啦

2，创建新用户
> create user monkey identified by '123456';

3, 重命名用户
> rename monkey to gorilla;

4, 修改用户密码
> set password for gorilla=password('654321');
> update mysql.user set password=password('654321') where user='gorilla'

5, 删除用户
> drop user gorilla;

6, 查看用户gorilla的权限
> show grants for gorilla;

7, 给用户gorilla赋予权限
> grant select,update,insert on new_database.* to gorilla; 
# 给gorilla赋予new_database数据库的所有数据表提供可以选择，更新，插入的权限

> grant * on new_database.* to gorilla@'%'
# % 表示匹配所有的主机，就是表示可以从任何主机上进行赋予权限的操作

8，撤销权限
> revoke select on new_database.* from gorilla;

9, 命令更新
> flush privileges;
# 所有的权限修改完之后都要执行刷新才能生效；

10， grant 和revoke 可以在几个层次上控制访问权限：

- 整个服务器  grant ALL , revoke ALL
- 整个数据库  on database.*
- 特定表  on database.mytable

11，grant 普通DBA 管理某个mysql 数据库权限
> grant all privileges on new_database to 'gorilla'@'%';

12, grant 高级DBA
> grant all on *.* to 'gorilla'@'%'
# 在这个小公司里我就是高级DBA，所以对于每个操作我都很谨慎

```

### 表操作
在后端代码中操作最多的大概也许就是表操作吧。

```markdown
1, 进入到特定数据库
> use new_database;
> show tables;

2, 创建新表
CREATE TABLE `t_person` (
  `id` int(10) unsigned NOT NULL AUTO_INCREMENT,
  `id_no` VARCHAR(20) NOT NULL DEFAULT '' COMMENT '身份证',
  `gender` tinyint(4) NOT NULL DEFAULT '1' COMMENT '1:男 2:女',
  `name` varchar(64) NOT NULL DEFAULT '' COMMENT '姓名',
  `birthday` DATE NOT NULL  COMMENT '生日，date范围是日期，datetime 时日期加时间',
  `profile` text  COMMENT '简历',
  `update_time` timestamp NULL DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
  PRIMARY KEY (`id`),
  UNIQUE KEY (`id_no`),
  INDEX `name_idx` (`name`)
) ENGINE=InnoDB AUTO_INCREMENT=100 DEFAULT CHARSET=utf8 ROW_FORMAT=COMPRESSED COMMENT='个人基本信息';

#创建一个表的时候要考虑各个表字段的类型
-int 就分为int(4个字节), tinyint(1个字节), smallint(2个字节), bigint(8个字节)

-varchar 字符型
-date 表示日期xxxx-xx-xx, datetime 表示xxxx-xx-xx xx:xx:xx
-timestamp 数据类型是一个比较特殊的数据类型，他可以自动在你不使用程序更新情况下只要你更新了记录timestamp会自动更新时间
默认为14位的 TIMESTAMP(14) | 格式为YYYYMMDDHHMMSS

# 在创建新记录和修改现有记录的时候都对这个数据列刷新：
> TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

# 在创建新记录的时候把这个字段设置为当前时间，但以后修改时，不再刷新它：
> TIMESTAMP DEFAULT CURRENT_TIMESTAMP

# 在创建新记录的时候把这个字段设置为0，以后修改时刷新它：
> TIMESTAMP ON UPDATE CURRENT_TIMESTAMP

# 在创建新记录的时候把这个字段设置为给定值，以后修改时刷新它：
> TIMESTAMP DEFAULT ‘yyyy-mm-dd hh:mm:ss' ON UPDATE CURRENT_TIMESTAMP

3, 修改数据表
 3.1 创建唯一索引
 > create unique index idx_name on t_table(`c_name`)
 > alter table t_table add unique idx_name on c_name;

 3.2 创建普通索引
 > create index idx_name on t_table(c_name1,c_name2,...);
 > alter table t_table add index idx_name on (c_name1,c_name2,...);

 3.3 修改数据表字段
 > ALTER TABLE t_table AUTO_INCREMENT=123 
 #重设自增的初始值
 > ALTER TABLE t_table ADD column_name int not null comment '' after xx;  
 #在列xx 后面增加一个column_name 的列
 
 > ALTER TABLE t_table drop column_name;
 # 删除一个表字段
 
 > alter table t_table add constraint unique_xx unique (customer_id,task_id);
 #增加唯一键, 或者采用如下方式
 > alter table dfca_contract add unique unique_xx(customer_id,task_id);
 
4, 查询数据库表
> SELECT * FROM t_table;
> SELECT c_name AS c1 FROM t_table WHERE c_name='c_value';
> SELECT * FROM t_table ORDER BY c_name;
> SELECT count(*) FROM t_table GROUP BY c_name;
> SELECT * FROM t_table LIMIT 1;
> SELECT t1.a, t2.b FROM t1 LEFT JOIN t2 ON t1.x=t2.y;

5, 插入数据库表
> INSERT INTO t_table(c1,c2,c3) VALUES (v1,v2,v3),(v11,v22,v33)

> INSERT INTO t_table SET c1=v1, c2=v2,c3=v3

6，删除数据表条目
> delete from t_table where name like %nary_%

7, 删除数据库表
> drop table t_table; 

```


### InnoDB 引擎的数据表

InnoDB的数据库表支持事务和外键约束

 1, 外键约束
 
 如果表A的主关键字是表B中的字段，则该字段称为表B的外键，表A称为主表，表B称为从表。
 
 ```markdown
　create table t_group (
　　id int not null,
　　name varchar(30),
　　primary key (id)
　);

    create table t_user (
    　　id int not null,
    　　name varchar(30),
    　　groupid int,
    　　primary key (id),
    　　foreign key (groupid) references t_group(id) on delete cascade on update cascade);
    
```

2, 事务

多个操作同时进行，如果有一个失败了则回滚。

```markdown
begin;
    update score set score=40 where scoreid=1;
savepoint s1;
    update score set score=50 where scoreid=2;
    select * from score;
rollback to savepoint s1; #这里就会回到score=40,不会执行score=50
    select * from score;
commit;
```

### 存储过程

参数类型：

in: 该参数的值必须在调用存储过程时指定，在 存储过程中修改该参数的值不能被返回，为默认值；

out: 该值可以在存储过程内部被改变，并可返回

inout: 调用时指定，并可以被改变和返回；

```markdown
DROP PROCEDURE if exists proc;
DELIMITER //
create procedure proc(out s int)
  BEGIN
    SELECT count(*) into s FROM dfca_contract;
  END //
DELIMITER ;

set @s=1;
call proc(@s);
SELECT @s; // 返回的不再是1 而是 13 了；
```

定义变量：declare xx int unsigned default 4000;

变量赋值: set @y=1 或者 select 'xx' into @x  

prepare 预编译：
```markdown
prepare p_name from @sql;
excute p_name
deallocate prepare p_name; // 解除分配，清除预编译；
```
