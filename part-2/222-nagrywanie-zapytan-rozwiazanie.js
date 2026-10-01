// Creator: WebInspector 537.36

import { sleep, group } from 'k6'
import { parseHTML } from 'k6/html'
import http from 'k6/http'

export const options = {

  scenarios: {
    www_presta: {
      // Executor type to use https://grafana.com/docs/k6/latest/using-k6/scenarios/#scenario-executors
      executor: 'ramping-vus',
      startVUs: 0,
      stages: [
        { duration: '15s', target: 10 },
        { duration: '45s', target: 10 },
      ],
      gracefulRampDown: '0s',
      // common scenario configuration
    }
  }
}

export default function() {

    let response, product_details_link
  const BASE = "3.71.14.30:8001"
  const BASE_URL = `http://${BASE}`

  group('Home Page', function () {
  response = http.get(`${BASE_URL}`, {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8,es;q=0.7,it;q=0.6,de;q=0.5',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      Host: `${BASE}`,
      Pragma: 'no-cache',
      Referer: `${BASE_URL}`,
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    },
  })

  let document = parseHTML(response.body);
  let product_links = document.find('article a.thumbnail.product-thumbnail')
  let next_link_index = Math.floor(Math.random() * (product_links.size() - 1));
  product_details_link = product_links.eq(next_link_index).attr("href");

  response = http.get(
    `${BASE_URL}/module/blockwishlist/action?action=getAllWishlist`,
    {
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8,es;q=0.7,it;q=0.6,de;q=0.5',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Host: `${BASE}`,
        Pragma: 'no-cache',
        Referer: `${BASE_URL}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      },
    }
  )
  response = http.get(
    `${BASE_URL}/module/productcomments/CommentGrade?id_products%5B%5D=1&id_products%5B%5D=2&id_products%5B%5D=3&id_products%5B%5D=4&id_products%5B%5D=5&id_products%5B%5D=6&id_products%5B%5D=7&id_products%5B%5D=8&id_products%5B%5D=12&id_products%5B%5D=13&id_products%5B%5D=14&id_products%5B%5D=15&id_products%5B%5D=16&id_products%5B%5D=17&id_products%5B%5D=18&id_products%5B%5D=19&id_products%255B%255D=1&id_products%255B%255D=2&id_products%255B%255D=3&id_products%255B%255D=4&id_products%255B%255D=5&id_products%255B%255D=6&id_products%255B%255D=7&id_products%255B%255D=8&id_products%255B%255D=12&id_products%255B%255D=13&id_products%255B%255D=14&id_products%255B%255D=15&id_products%255B%255D=16&id_products%255B%255D=17&id_products%255B%255D=18&id_products%255B%255D=19`,
    {
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8,es;q=0.7,it;q=0.6,de;q=0.5',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Host: `${BASE}`,
        Pragma: 'no-cache',
        Referer: `${BASE_URL}`,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
        'X-Requested-With': 'XMLHttpRequest',
      },
    }
  )

})
sleep(15 + Math.floor(Math.random() * 15))
group('Product Details', function () {
  response = http.get(product_details_link, {
    headers: {
      Accept:
        'text/html,application/xhtml+xml,application/xml;q=0.9,image/avif,image/webp,image/apng,*/*;q=0.8,application/signed-exchange;v=b3;q=0.7',
      'Accept-Encoding': 'gzip, deflate',
      'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8,es;q=0.7,it;q=0.6,de;q=0.5',
      'Cache-Control': 'no-cache',
      Connection: 'keep-alive',
      Host: `${BASE}`,
      Pragma: 'no-cache',
      Referer: `${BASE_URL}`,
      'Upgrade-Insecure-Requests': '1',
      'User-Agent':
        'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
    },
    tags: {
      name: `${BASE_URL}/{product-slug}`
    }
  })
  response = http.get(
    `${BASE_URL}/module/blockwishlist/action?action=getAllWishlist`,
    {
      headers: {
        Accept: '*/*',
        'Accept-Encoding': 'gzip, deflate',
        'Accept-Language': 'en-US,en;q=0.9,pl;q=0.8,es;q=0.7,it;q=0.6,de;q=0.5',
        'Cache-Control': 'no-cache',
        Connection: 'keep-alive',
        Host: `${BASE}`,
        Pragma: 'no-cache',
        Referer: product_details_link,
        'User-Agent':
          'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/136.0.0.0 Safari/537.36',
      },
    }
  )

})
sleep(15 + Math.floor(Math.random() * 15))
}