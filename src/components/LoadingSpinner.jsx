import { Spinner } from 'react-bootstrap';

function LoadingSpinner() {
  return (
    <div className="d-flex justify-content-center align-items-center" style={{ height: '70vh' }}>
      <Spinner animation="border" variant="warning" role="status">
        <span className="visually-hidden">Loading...</span>
      </Spinner>
    </div>
  );
}

export default LoadingSpinner;