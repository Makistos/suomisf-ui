import React from 'react';

import { ArticleBrief } from "./article-brief";
import { Article } from "../types";

type ArticleListProps = {
    articles: Article[]
}

export const ArticleList = ({ articles }: ArticleListProps) => {

    return (
        <>
            {
                articles.map((article: Article) => {
                    return (
                        <div key={article.id}>
                            <ArticleBrief key={article.id}
                                article={article}
                            />
                        </div>
                    )
                })
            }
        </>
    )

}