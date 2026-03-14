#include <algorithm>
#include <iomanip>
#include <iostream>
#include <sstream>
#include <string>
#include <openssl/evp.h>

std::string canonicalize_newlines(const std::string &input) {
  std::string out;
  out.reserve(input.size());
  for (size_t i = 0; i < input.size(); ++i) {
    if (input[i] == '\r') {
      if (i + 1 < input.size() && input[i + 1] == '\n') {
        ++i;
      }
      out.push_back('\n');
    } else {
      out.push_back(input[i]);
    }
  }
  return out;
}

std::string canonical_hash(const std::string &json) {
  std::string normalized = canonicalize_newlines(json);
  EVP_MD_CTX *ctx = EVP_MD_CTX_new();
  const EVP_MD *md = EVP_blake2s256();
  unsigned char digest[EVP_MAX_MD_SIZE];
  unsigned int digest_len = 0;

  EVP_DigestInit_ex(ctx, md, nullptr);
  EVP_DigestUpdate(ctx, normalized.data(), normalized.size());
  EVP_DigestFinal_ex(ctx, digest, &digest_len);
  EVP_MD_CTX_free(ctx);

  std::ostringstream oss;
  for (unsigned int i = 0; i < digest_len; ++i) {
    oss << std::hex << std::setw(2) << std::setfill('0') << static_cast<int>(digest[i]);
  }
  return oss.str();
}

int main() {
  std::ostringstream buffer;
  buffer << std::cin.rdbuf();
  std::cout << canonical_hash(buffer.str()) << std::endl;
  return 0;
}
