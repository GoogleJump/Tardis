import scrapy

class Scraper(scrapy.Item):
	name = 'demo'
	title = scrapy.Field();
	link = scrapy.Field();
	desc = scrapy.Field();
	allowed_domains = ["dmoz.org"]
    start_urls = [
        "http://www.dmoz.org/Computers/Programming/Languages/Python/Books/",
        "http://www.dmoz.org/Computers/Programming/Languages/Python/Resources/"
    ]

	def parse(self, response):
        filename = response.url.split("/")[-2]
        with open(filename, 'wb') as f:
            f.write(response.body)

def main():
	print 'test'

if __name__ == "__main__":
    main()
