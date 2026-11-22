import { Link } from 'react-router-dom'
import { HomeIcon } from '../components/Icons'

export default function NotFoundPage() {
  return (
    <div className="notfound">
      <span className="notfound-code">404</span>
      <h2>Page not found</h2>
      <p>The page you're looking for doesn't exist or hasn't been published yet.</p>
      <Link to="/" className="notfound-link">
        <HomeIcon size={16} />
        Back to home
      </Link>
    </div>
  )
}
