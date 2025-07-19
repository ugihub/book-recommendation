import { Navbar, Container, Nav, Button, NavDropdown, Form, InputGroup, Dropdown } from 'react-bootstrap';
import { Link } from 'react-router-dom';
import { useAuth } from '../hooks/useAuth';
import { useTheme } from '../context/ThemeContext'; // 1. Impor useTheme

function AppNavbar({ searchQuery, setSearchQuery, searchCategory, setSearchCategory }) {
  const { user, logout } = useAuth();
  const { theme, toggleTheme } = useTheme(); // 2. Ambil data dan fungsi tema dari context

  return (
    <Navbar expand="lg" className="imdb-navbar">
      <Container>
        <Navbar.Brand as={Link} to="/">
          <span style={{backgroundColor: '#F59E0B', color: '#121212', padding: '0 8px', borderRadius: '5px', marginRight: '5px'}}>R</span>
          ekomBuku
        </Navbar.Brand>
        
        <Navbar.Toggle aria-controls="basic-navbar-nav" />
        
        <Navbar.Collapse id="basic-navbar-nav">
          
          {/* Form Pencarian */}
          <div className="flex-grow-1 mx-lg-3 my-2 my-lg-0">
            <InputGroup>
              <Dropdown onSelect={(eventKey) => setSearchCategory(eventKey)}>
                <Dropdown.Toggle variant="warning" id="dropdown-search-category">
                  {searchCategory}
                </Dropdown.Toggle>
                <Dropdown.Menu variant="dark">
                  <Dropdown.Item eventKey="Semua">Semua</Dropdown.Item>
                  <Dropdown.Item eventKey="Judul">Judul</Dropdown.Item>
                  <Dropdown.Item eventKey="Penulis">Penulis</Dropdown.Item>
                </Dropdown.Menu>
              </Dropdown>
              <Form.Control
                type="search"
                placeholder="Cari buku atau penulis..."
                className="search-bar"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <Button variant="warning">🔍</Button>
            </InputGroup>
          </div>

          {/* Menu User di sebelah kanan */}
          <Nav className="ms-auto d-flex align-items-center flex-row">
            {/* 3. Tambahkan Tombol Toggle Tema di sini */}
            <Button variant="outline-warning" onClick={toggleTheme} className="me-3">
              {theme === 'light' ? '🌙' : '☀️'}
            </Button>
            
            { user ? (
              <>
                <Nav.Link disabled className="me-2 d-none d-lg-block">Halo, {user.name}</Nav.Link>
                <NavDropdown title="Menu" id="basic-nav-dropdown" menuVariant="dark" align="end">
                  <NavDropdown.Item as={Link} to="/dashboard">Dashboard Saya</NavDropdown.Item>
                  <NavDropdown.Item as={Link} to="/booklist">Booklist Saya</NavDropdown.Item>
                  <NavDropdown.Divider />
                  <NavDropdown.Item onClick={logout}>Logout</NavDropdown.Item>
                </NavDropdown>
              </>
            ) : (
              <Link to="/login" className="btn btn-outline-light">Login</Link>
            )}
          </Nav>

        </Navbar.Collapse>
      </Container>
    </Navbar>
  );
}

export default AppNavbar;