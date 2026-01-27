#!/bin/bash

# Find all catch blocks without parameter and references to error
# Pattern 1: } catch { followed by code using 'error'
# Pattern 2: } catch { with no error references (use _error)

# Get list of files with catch blocks
files=$(rg -l "} catch \{" src/ --type ts)

for file in $files; do
    echo "Processing $file..."
    
    # Find catch blocks with error references and fix them
    rg -n "} catch \{" "$file" -A 5 | while read line; do
        # Extract line number
        line_num=$(echo "$line" | cut -d: -f1 | grep -oE '[0-9]+')
        
        if [ -n "$line_num" ]; then
            # Check if next lines reference 'error'
            next_line=$((line_num + 1))
            next_5_lines=$(sed -n "${next_line},$((next_line + 5))p" "$file")
            
            if echo "$next_5_lines" | grep -q "\berror\b"; then
                echo " fixing line $line_num: needs (error)"
                # Using sed to change } catch { to } catch (error) {
                sed -i "${line_num}s/} catch {/} catch (error) {/" "$file"
            else
                echo " fixing line $line_num: using (_error)"
                sed -i "${line_num}s/} catch {/} catch (_error) {/" "$file"
            fi
        fi
    done
done

echo "Done!"
