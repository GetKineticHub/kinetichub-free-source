for dir in build/blocks/*/; do
  echo "<?php // Silence is golden." > "$dir/index.php"
done