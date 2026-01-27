sed -i '201s/} catch {$/} catch (error) {/' truelayer.ts
sed -i '293s/} catch {$/} catch (err) {/' truelayer.ts
sed -i '344s/} catch {$/} catch (err) {/' truelayer.ts
sed -i '363s/} catch {$/} catch (error) {/' truelayer.ts
echo "Fixed all catch blocks in truelayer.ts"
