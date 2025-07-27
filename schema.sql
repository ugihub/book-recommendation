CREATE SCHEMA IF NOT EXISTS "public";

CREATE SEQUENCE "public".book_edits_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE SEQUENCE "public".book_submissions_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE SEQUENCE "public".books_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE SEQUENCE "public".reviews_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE SEQUENCE "public".users_id_seq AS integer START WITH 1 INCREMENT BY 1;

CREATE  TABLE "public".users ( 
	"id"                 serial  NOT NULL  ,
	nama                 varchar(100)  NOT NULL  ,
	email                varchar(100)  NOT NULL  ,
	password_hash        text  NOT NULL  ,
	"role"               varchar DEFAULT 'user'::character varying   ,
	created_at           timestamp DEFAULT CURRENT_TIMESTAMP   ,
	suspended_until      timestamp    ,
	suspension_reason    text    ,
	CONSTRAINT users_pkey PRIMARY KEY ( "id" ),
	CONSTRAINT users_email_key UNIQUE  ( email )
 );

CREATE  TABLE "public".book_submissions ( 
	"id"                 serial  NOT NULL  ,
	judul                varchar(255)  NOT NULL  ,
	penulis              varchar(150)  NOT NULL  ,
	deskripsi            text    ,
	genre                varchar(100)    ,
	tahun_terbit         integer    ,
	sampul_url           text    ,
	submitter_id         integer  NOT NULL  ,
	status               varchar DEFAULT 'pending'::character varying   ,
	submitted_at         timestamp DEFAULT CURRENT_TIMESTAMP   ,
	approved_by          integer    ,
	link_baca_beli       text    ,
	created_at           timestamp DEFAULT CURRENT_TIMESTAMP   ,
	CONSTRAINT book_submissions_pkey PRIMARY KEY ( "id" )
 );

CREATE  TABLE "public".books ( 
	"id"                 serial  NOT NULL  ,
	judul                varchar(255)  NOT NULL  ,
	penulis              varchar(150)  NOT NULL  ,
	deskripsi            text    ,
	genre                varchar(100)    ,
	tahun_terbit         integer    ,
	sampul_url           text    ,
	awards               text[]    ,
	created_at           timestamp DEFAULT CURRENT_TIMESTAMP   ,
	link_baca_beli       text    ,
	submitter_id         integer    ,
	status               varchar DEFAULT 'published'::character varying   ,
	CONSTRAINT books_pkey PRIMARY KEY ( "id" )
 );

CREATE INDEX idx_books_judul ON "public".books USING  btree ( judul );

CREATE INDEX idx_books_penulis ON "public".books USING  btree ( penulis );

CREATE INDEX idx_books_genre ON "public".books USING  btree ( genre );

CREATE INDEX idx_books_tahun_terbit ON "public".books USING  btree ( tahun_terbit );

CREATE  TABLE "public".reviews ( 
	"id"                 serial  NOT NULL  ,
	user_id              integer    ,
	book_id              integer  NOT NULL  ,
	rating               integer    ,
	ulasan               text    ,
	status               varchar DEFAULT 'pending'::character varying   ,
	created_at           timestamp DEFAULT CURRENT_TIMESTAMP   ,
	anonymous            boolean DEFAULT false   ,
	reviewer_name        varchar(100)    ,
	CONSTRAINT reviews_pkey PRIMARY KEY ( "id" )
 );

ALTER TABLE "public".reviews ADD CONSTRAINT reviews_rating_check CHECK ( rating >= 1) AND (rating <= 5 );

CREATE  TABLE "public".book_edits ( 
	"id"                 serial  NOT NULL  ,
	book_id              integer  NOT NULL  ,
	submitter_id         integer  NOT NULL  ,
	judul                text    ,
	penulis              text    ,
	genre                text    ,
	tahun_terbit         integer    ,
	deskripsi            text    ,
	link_baca_beli       text    ,
	awards               text    ,
	sampul_url           text    ,
	status               varchar DEFAULT 'pending'::character varying   ,
	created_at           timestamp DEFAULT now()   ,
	updated_at           timestamp DEFAULT now()   ,
	submitted_at         timestamp DEFAULT CURRENT_TIMESTAMP   ,
	CONSTRAINT book_edits_pkey PRIMARY KEY ( "id" )
 );

CREATE INDEX idx_book_edits_book_id ON "public".book_edits USING  btree ( book_id );

CREATE INDEX idx_book_edits_submitter_id ON "public".book_edits USING  btree ( submitter_id );

ALTER TABLE "public".book_edits ADD CONSTRAINT book_edits_book_id_fkey FOREIGN KEY ( book_id ) REFERENCES "public".books( "id" );

ALTER TABLE "public".book_edits ADD CONSTRAINT book_edits_submitter_id_fkey FOREIGN KEY ( submitter_id ) REFERENCES "public".users( "id" );

ALTER TABLE "public".book_submissions ADD CONSTRAINT book_submissions_approved_by_fkey FOREIGN KEY ( approved_by ) REFERENCES "public".users( "id" );

ALTER TABLE "public".book_submissions ADD CONSTRAINT book_submissions_submitter_id_fkey FOREIGN KEY ( submitter_id ) REFERENCES "public".users( "id" ) ON DELETE CASCADE;

ALTER TABLE "public".books ADD CONSTRAINT books_submitter_id_fkey FOREIGN KEY ( submitter_id ) REFERENCES "public".users( "id" ) ON DELETE CASCADE;

ALTER TABLE "public".reviews ADD CONSTRAINT reviews_book_id_fkey FOREIGN KEY ( book_id ) REFERENCES "public".books( "id" ) ON DELETE CASCADE;

ALTER TABLE "public".reviews ADD CONSTRAINT reviews_book_id_fkey1 FOREIGN KEY ( book_id ) REFERENCES "public".books( "id" ) ON DELETE CASCADE;

ALTER TABLE "public".reviews ADD CONSTRAINT reviews_book_id_fkey2 FOREIGN KEY ( book_id ) REFERENCES "public".books( "id" ) ON DELETE CASCADE;

ALTER TABLE "public".reviews ADD CONSTRAINT reviews_user_id_fkey FOREIGN KEY ( user_id ) REFERENCES "public".users( "id" ) ON DELETE CASCADE;
