// app/api/getPresignedUrl/route.ts
export async function GET(request:any) {
  const urlSearchParams = new URL(request.url).searchParams;
  const fileName = urlSearchParams.get('fileName');
  if (!fileName) {
    return new Response(JSON.stringify({ error: 'FileName query parameter is required.' }), {
      status: 400,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }

  try {
    // Fetch the pre-signed URL from the AWS API Gateway
    const awsResponse = await fetch(`https://o5wqt10yf2.execute-api.us-east-1.amazonaws.com/dev?fileName=${encodeURIComponent(fileName)}`);
    if (awsResponse.ok) {
      const data = await awsResponse.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Error fetching pre-signed URL' }), {
        status: awsResponse.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error fetching pre-signed URL' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
