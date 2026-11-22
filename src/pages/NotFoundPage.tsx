import { Link } from 'react-router-dom'

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or hasn't been published yet.</p>
      <Link to="/">Back to home</Link>
    </div>
  )
}
