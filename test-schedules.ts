
const url = 'http://localhost:3000/api/schedules';

async function testSchedules() {
  try {
    console.log('Fetching schedules from:', url);
    const response = await fetch(url);
    console.log('Status:', response.status);
    
    if (response.ok) {
      const data = await response.json();
      console.log('Data:', JSON.stringify(data, null, 2));
    } else {
      const text = await response.text();
      console.log('Error:', text);
    }
  } catch (error) {
    console.error('Fetch error:', error);
  }
}

testSchedules();
