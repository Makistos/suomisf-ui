import { ArticleBrief } from "./ArticleBrief";
import { IArticle } from "./Article";

type ArticleListProps = {
    articles: IArticle[]
}

export const ArticleList = ({ articles }: ArticleListProps) => {

    return (
        <>
            {
                articles.map((article: IArticle) => {
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