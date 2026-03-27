import { HelmetProvider } from 'react-helmet-async'
import { BrowserRouter, Route, Routes } from 'react-router-dom'
import { KitDocente } from './KitDocente'

function App() {
  return (
    <HelmetProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/*" element={<KitDocente />} />
        </Routes>
      </BrowserRouter>
    </HelmetProvider>
  )
}

export default App
