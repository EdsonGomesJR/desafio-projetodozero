/* eslint-disable @typescript-eslint/explicit-function-return-type */
import { GetStaticProps } from 'next';
import Link from 'next/link';

import Prismic from '@prismicio/client';
import Head from 'next/head';

import { FiCalendar, FiUser } from 'react-icons/fi';
import { useState } from 'react';
import { format } from 'date-fns';
import { ptBR } from 'date-fns/locale';
import { getPrismicClient } from '../services/prismic';
import commonStyles from '../styles/common.module.scss';
import styles from './home.module.scss';
import Header from '../components/Header';

interface Post {
  uid?: string;
  first_publication_date: string | null;
  data: {
    title: string;
    subtitle: string;
    author: string;
  };
}

interface PostPagination {
  next_page: string;
  results: Post[];
}

interface HomeProps {
  postsPagination: PostPagination;
}

export default function Home({ postsPagination }: HomeProps): JSX.Element {
  const [nextPage, setNextPage] = useState(postsPagination.next_page);
  const [currentPage, setCurrentPage] = useState(1);

  const formatedDate = postsPagination.results.map(post => {
    return {
      ...post,
      first_publication_date: format(
        new Date(post.first_publication_date),
        'dd MMM yyyy',
        {
          locale: ptBR,
        }
      ),
    };
  });
  const [posts, setPosts] = useState<Post[]>(formatedDate);

  async function handleNextPage(): Promise<void> {
    if (currentPage !== 1 && nextPage === null) {
      return;
    }

    const postsResults = await fetch(`${nextPage}`).then(response =>
      response.json()
    );

    setNextPage(postsResults.next_page);
    setCurrentPage(postsResults.page);

    const newPosts = postsResults.results.map((post: Post) => {
      return {
        uid: post.uid,
        data: {
          title: post.data.title,
          subtitle: post.data.subtitle,
          author: post.data.author,
        },

        first_publication_date: format(
          new Date(post.first_publication_date),
          'dd MMM yyyy',
          {
            locale: ptBR,
          }
        ),
      };
    });
    setPosts([...posts, ...newPosts]);
  }
  return (
    <>
      <Head>
        <title>Posts | spacetravelling</title>
      </Head>
      <main className={commonStyles.container}>
        <Header />

        <div className={styles.posts}>
          {posts.map(result => (
            <Link key={result.uid} href={`/post/${result.uid}`}>
              <a className={styles.post}>
                <strong>{result.data.title}</strong>
                <p>{result.data.subtitle}</p>
                <ul>
                  <li>
                    <FiCalendar />
                    {result.first_publication_date}
                  </li>
                  <li>
                    <FiUser />
                    {result.data.author}
                  </li>
                </ul>
              </a>
            </Link>
          ))}
          {nextPage && (
            <button type="button" onClick={handleNextPage}>
              Carregar mais posts
            </button>
          )}
        </div>
      </main>
    </>
  );
}

export const getStaticProps: GetStaticProps = async () => {
  const prismic = getPrismicClient();

  const response = await prismic.query(
    [Prismic.predicates.at('document.type', 'post')],
    {
      pageSize: 1,
    }
  );

  const results = response.results.map(result => {
    return {
      uid: result.uid,
      data: {
        title: result.data.title,
        subtitle: result.data.subtitle,
        author: result.data.author,
      },

      first_publication_date: result.first_publication_date,
    };
  });

  const postsPagination = {
    next_page: response.next_page,
    results,
  };

  return {
    props: {
      postsPagination,
      // será se a paginação recebe o next_page do response
    },
  };
};
