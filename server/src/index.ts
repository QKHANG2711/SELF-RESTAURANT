import app from './app';

const PORT = process.env.PORT || 5000;

app.listen(PORT, () => {
  console.log(`=================================================`);
  console.log(`🍽️  SELF RESTAURANT SERVER RUNNING ON PORT ${PORT}`);
  console.log(`🔗 API Base: http://localhost:${PORT}/api`);
  console.log(`🔗 Health Check: http://localhost:${PORT}/api/health`);
  console.log(`=================================================`);
});
