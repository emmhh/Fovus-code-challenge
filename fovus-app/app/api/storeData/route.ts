// app/api/storeData/route.ts
export async function POST(request:any) {
  try {
    // console.log('request:', request);
    const { input_text, input_file } = await request.json();
    // console.log('inputText:', input_text);
    // console.log('filePath:', input_file);
    const awsResponse = await fetch('https://yl9zletvr9.execute-api.us-east-1.amazonaws.com/dev', {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({
        input_file: input_file,
        input_text: input_text,
      }),
    });

    if (awsResponse.ok) {
      const data = await awsResponse.json();
      return new Response(JSON.stringify(data), {
        status: 200,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    } else {
      return new Response(JSON.stringify({ error: 'Error storing data' }), {
        status: awsResponse.status,
        headers: {
          'Content-Type': 'application/json',
        },
      });
    }
  } catch (error) {
    return new Response(JSON.stringify({ error: 'Error storing data' }), {
      status: 500,
      headers: {
        'Content-Type': 'application/json',
      },
    });
  }
}
