import requests
from bs4 import BeautifulSoup

response = requests.get('https://members.myactivesg.com/facilities/result')
soup = BeautifulSoup(response.text)
venue_select = soup.find(id = 'venue_filter')
### Doesn't work as options are loaded dynamically into the select element