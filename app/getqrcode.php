<?php

$dbconn = pg_connect("host=real-it.duckdns.org dbname=billetterie user=stqmatane password=THE_PASSWORD_HERE port=2232");

if (isset($_GET['qr'])) {
	$query = 	"SELECT passager.prenom, passager.nom 
				FROM commande
				INNER JOIN acheteur ON acheteur.id_acheteur = commande.id_acheteur
				INNER JOIN passager ON passager.id_acheteur = acheteur.id_acheteur
				WHERE commande.qrcode = '". $_GET['qr'] ."';";
	$result = pg_query($query);
	
	if (pg_num_rows($result) == 0) {
		echo "Billet invalide";
	} else {
		
		echo "<table>\n";
		echo "<tr>\n";
		echo "<th>Prénom</th>";
		echo "<th>Nom</th>"; 		
		echo "</tr>\n";
		while ($line = pg_fetch_array($result, null, PGSQL_ASSOC)) {
			echo "\t<tr>\n";
			foreach ($line as $col_value) {
				echo "\t\t<td>$col_value</td>\n";
			}
			echo "\t</tr>\n";
		}
		echo "</table>\n";

		// Free resultset
		pg_free_result($result);
	}

	

} else {
	echo "ERREUR";
}

// Closing connection
pg_close($dbconn);

?>