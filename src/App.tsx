import { Navigate, Route, Routes } from 'react-router-dom'
import Layout from './components/Layout'
import HomePage from './pages/HomePage'
import VerticalPage from './pages/VerticalPage'
import EntryPage from './pages/EntryPage'
import SearchPage from './pages/SearchPage'
import NotFoundPage from './pages/NotFoundPage'

export default function App() {
  return (
    <Routes>
      <Route element={<Layout />}>
        <Route index element={<HomePage />} />
        <Route path="/search" element={<SearchPage />} />
        <Route path="/:verticalSlug" element={<VerticalPage />} />
        <Route path="/:verticalSlug/_/latest/:slugOrId" element={<EntryPage />} />
        <Route path="/:verticalSlug/:categorySlug/:slugOrId" element={<EntryPage />} />
        <Route path="/:verticalSlug/:slugOrId" element={<EntryPage />} />
        <Route path="/not-found" element={<NotFoundPage />} />
        <Route path="*" element={<Navigate to="/not-found" replace />} />
      </Route>
    </Routes>
  )
}
